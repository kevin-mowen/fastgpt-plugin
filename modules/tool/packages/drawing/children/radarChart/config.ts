import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '雷达图',
    en: 'Radar Chart'
  },
  description: {
    'zh-CN': '生成雷达图，用于多维数据对比分析，支持基础和填充两种类型',
    en: 'Generate radar charts for multi-dimensional data comparison analysis'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'v2.0 架构：专业工具 + 多维分析',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'title',
          label: '图表标题',
          description: '图表的标题（可选）',
          required: false,
          toolDescription: '图表的标题，留空则不显示标题'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'indicators',
          label: '指标名称',
          description: '雷达图各个维度的指标名称，例如：["攻击力", "防御力", "速度", "技能"]',
          required: true,
          toolDescription: '雷达图各个维度的指标名称'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'values',
          label: '数值数据',
          description: '对应各指标的数值，例如：[80, 90, 65, 70]',
          required: true,
          toolDescription: '对应各个指标的数值数据'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'maxValues',
          label: '最大值设置',
          description: '各指标的最大值，例如：[100, 100, 100, 100]，留空则自动计算',
          required: false,
          toolDescription: '各个指标的最大值，用于设置雷达图的坐标轴范围'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSubType',
          label: '雷达图类型',
          description: '选择雷达图的子类型',
          required: false,
          defaultValue: 'basic',
          list: [
            {
              label: '基础雷达图',
              value: 'basic'
            },
            {
              label: '填充雷达图',
              value: 'filled'
            }
          ],
          toolDescription: '雷达图类型：basic(基础线条), filled(填充区域)'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'colorScheme',
          label: '颜色方案',
          description: '选择图表的配色方案',
          required: false,
          defaultValue: 'blue',
          list: [
            {
              label: '蓝色系',
              value: 'blue'
            },
            {
              label: '绿色系',
              value: 'green'
            },
            {
              label: '暖色系',
              value: 'warm'
            },
            {
              label: '冷色系',
              value: 'cool'
            },
            {
              label: '紫色系',
              value: 'purple'
            }
          ],
          toolDescription: '图表配色方案：blue, green, warm, cool, purple'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSize',
          label: '图表尺寸',
          description: '选择图表尺寸',
          required: false,
          defaultValue: 'medium',
          list: [
            {
              label: '小型 (400x300)',
              value: 'small'
            },
            {
              label: '中型 (600x450)',
              value: 'medium'
            },
            {
              label: '大型 (800x600)',
              value: 'large'
            }
          ],
          toolDescription: '图表尺寸：small(400x300), medium(600x450), large(800x600)'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'legendPosition',
          label: '图例位置',
          description: '选择图例显示位置',
          required: false,
          defaultValue: 'bottom',
          list: [
            {
              label: '顶部',
              value: 'top'
            },
            {
              label: '右侧',
              value: 'right'
            },
            {
              label: '底部',
              value: 'bottom'
            },
            {
              label: '左侧',
              value: 'left'
            }
          ],
          toolDescription: '图例位置：top, right, bottom, left'
        }
      ],
      outputs: [
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '生成的雷达图URL，可用markdown格式展示：![图片](url)',
          defaultValue: '',
          label: '图表URL',
          key: 'chartUrl'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: 'ECharts配置JSON，用于调试和二次开发',
          defaultValue: '',
          label: 'ECharts配置',
          key: 'echartsConfig'
        },
        {
          valueType: WorkflowIOValueTypeEnum.string,
          description: '图表特性说明',
          defaultValue: '',
          label: '图表说明',
          key: 'chartDescription'
        }
      ]
    }
  ]
});
