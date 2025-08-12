import { defineTool } from '@tool/type';
import {
  FlowNodeInputTypeEnum,
  FlowNodeOutputTypeEnum,
  WorkflowIOValueTypeEnum
} from '@tool/type/fastgpt';

export default defineTool({
  name: {
    'zh-CN': '折线图',
    en: 'Line Chart'
  },
  description: {
    'zh-CN': '生成折线图，支持基础、平滑、阶梯、面积四种子类型，具备小范围大数值智能优化功能',
    en: 'Generate line charts with basic, smooth, stepped, area subtypes and smart optimization for small-range large-value data'
  },
  versionList: [
    {
      value: '0.1.0',
      description: 'v2.0 架构：简化工具 + 智能优化',
      inputs: [
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'title',
          label: '图表标题',
          description: '图表的标题',
          toolDescription: '图表的标题'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'xAxis',
          label: 'X轴数据',
          description: 'X轴数据，例如：["1月", "2月", "3月"]',
          required: true,
          toolDescription: 'X轴数据，支持时间序列、分类等，例如：["1月", "2月", "3月"]'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.input, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.arrayString,
          key: 'yAxis',
          label: 'Y轴数据',
          description: 'Y轴数值数据，例如：[100, 200, 300]',
          required: true,
          toolDescription: 'Y轴数值数据，例如：[100, 200, 300]，支持小范围大数值智能优化'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.select, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.string,
          key: 'chartSubType',
          label: '折线图类型',
          description: '选择折线图的子类型',
          required: false,
          defaultValue: 'basic',
          list: [
            {
              label: '基础折线',
              value: 'basic'
            },
            {
              label: '平滑折线',
              value: 'smooth'
            },
            {
              label: '阶梯折线',
              value: 'stepped'
            },
            {
              label: '面积图',
              value: 'area'
            }
          ],
          toolDescription: '折线图类型：basic(基础), smooth(平滑), stepped(阶梯), area(面积)'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'autoOptimize',
          label: '智能优化Y轴',
          description: '自动检测并优化小范围大数值显示问题',
          required: false,
          defaultValue: true,
          toolDescription: '开启后自动检测小范围大数值问题并优化Y轴范围'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'yMin',
          label: 'Y轴最小值',
          description: '手动设置Y轴最小值（可选）',
          required: false,
          toolDescription: '手动设置Y轴最小值，留空则自动计算'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.numberInput, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.number,
          key: 'yMax',
          label: 'Y轴最大值',
          description: '手动设置Y轴最大值（可选）',
          required: false,
          toolDescription: '手动设置Y轴最大值，留空则自动计算'
        },
        {
          renderTypeList: [FlowNodeInputTypeEnum.switch, FlowNodeInputTypeEnum.reference],
          selectedTypeIndex: 0,
          valueType: WorkflowIOValueTypeEnum.boolean,
          key: 'showZeroLine',
          label: '显示零基线',
          description: '是否强制显示零基线',
          required: false,
          defaultValue: true,
          toolDescription: '是否强制Y轴从0开始，关闭可更好显示小范围变化'
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
          description: '生成的折线图URL，可用markdown格式展示：![图片](url)',
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
          description: '智能检测结果和建议',
          defaultValue: '',
          label: '优化建议',
          key: 'optimizationTip'
        }
      ]
    }
  ]
});
